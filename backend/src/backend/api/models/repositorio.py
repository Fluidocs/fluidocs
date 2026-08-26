from tortoise import fields, models

class Repositorio(models.Model):
    id = fields.IntField(null=False, pk=True)
    descricao = fields.CharField(null=False, max_length=255)
    url_integracao = fields.CharField(null=True, max_length=255)
    repositorio_integracao = fields.CharField(null=True,max_length=255)
    
    credencial_integracao = fields.ForeignKeyField(
        'models.CredencialIntegracao', 
        related_name='repositorios_credencial_integracao',
        on_delete=fields.CASCADE,
        null=True 
    )
    grupo_acesso = fields.ManyToManyField(
        "models.GrupoAcesso", 
        related_name="repositorios_grupos_acesso",
        null=True # TODO settar False quando estiver implementado (grupos de acesso)
    )
    organizacao = fields.ForeignKeyField(
        'models.Organizacao', 
        related_name='repositorios_organizacao',
        on_delete=fields.CASCADE,
        null=True # TODO settar False quando estiver implementado (multitenant)
    )

    class Meta:
        table = "repositorio"