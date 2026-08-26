from tortoise import fields, models

class GrupoAcesso(models.Model):
    id = fields.IntField(pk=True)
    ativo = fields.BooleanField(null=False, default=True)
    nome = fields.CharField(null=False, max_length=60)
    descricao = fields.CharField(null=True, max_length=255)
    
    organizacao = fields.ForeignKeyField(
        'models.Organizacao', 
        related_name='grupos_acesso_organizacao',
        on_delete=fields.CASCADE
    )
    class Meta:
        table = "grupo_acesso"